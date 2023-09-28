import imaplib
import email
import boto3
import os

# Initialize the S3 client
s3 = boto3.client('s3')

GMAIL_IMAP_SERVER = "imap.gmail.com"
GMAIL_EMAIL = "ecosheds.org@gmail.com"
GMAIL_PASSWORD = os.environ['FPE_EMAIL_PASSWORD']
DESTINATION_S3_BUCKET = os.environ['FPE_S3_BUCKET']

def handler(event, context):
    # Connect to Gmail IMAP server
    print("connecting to gmail")
    mail = imaplib.IMAP4_SSL(GMAIL_IMAP_SERVER)
    print("logging in")
    mail.login(GMAIL_EMAIL, GMAIL_PASSWORD)

    # Select the mailbox you want, 'inbox' in this case. Set readonly to False so that the flags of the email can be changed
    mail.select('inbox', readonly=False)

    # Search for emails with the 'photo' label (which translates to a Gmail folder)
    print("fetching emails")
    result, numbers = mail.search(None, 'X-GM-LABELS', 'fpe/photo')
    if result != "OK":
        return {
            'statusCode': 400,
            'body': 'Error searching for emails'
        }
    print(f"found {len(numbers[0].split())} emails")

    # Process each email
    for num in numbers[0].split():
        print(f"processing email {num.decode()}")
        result, data = mail.fetch(num, '(RFC822)')
        if result != "OK":
            continue

        # Parse the raw email data
        msg = email.message_from_bytes(data[0][1])

        # Save the email body to S3
        camera_ssn = None
        image_filename = None
        image_data = None
        if msg.is_multipart():
            print("multipart email")
            i = 1
            for part in msg.walk():
                print(f"part({i}): {part.get_content_type()}")
                if part.get_content_type() == "text/plain":
                    body = part.get_payload(decode=True)
                    camera_ssn = body.strip().decode()
                    print(f"camera ssn: {camera_ssn}")
                elif part.get_content_type() == "image/jpeg":
                    image_filename = part.get_filename()
                    print(f"filename: {image_filename}")
                    image_data = part.get_payload(decode=True)
                i += 1
        else:
            print("single part email")

        if camera_ssn is None:
            print("skipping email (camera_ssn not found)")
            continue
        if image_data is None:
            print("skipping email (image_data not found)")
            continue
        key = f'email/cameras/{camera_ssn}/{image_filename}'
        print(f"uploading s3://{DESTINATION_S3_BUCKET}/{key}")
        s3.put_object(
            Bucket=DESTINATION_S3_BUCKET,
            Key=key,
            Body=image_data,
            ContentType='image/jpeg'
        )
        print("remove label: fpe/photo")
        mail.store(num, '-X-GM-LABELS', 'fpe/photo')
        print("add label: fpe/archive")
        mail.store(num, '+X-GM-LABELS', 'fpe/done')
        print(f"done with email {num.decode()}")

    # Logout and close the connection
    mail.logout()

    return {
        'statusCode': 200,
        'body': f'Processed emails'
    }

if __name__ == "__main__":
    handler(None, None)
