export function imagePiiFlag (image) {
  return (image.pii_person >= 0.2 || image.pii_vehicle >= 0.8 || image.pii_on) && !image.pii_off
}
