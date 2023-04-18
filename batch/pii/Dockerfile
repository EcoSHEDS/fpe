FROM pytorch/pytorch:1.10.0-cuda11.3-cudnn8-runtime

RUN apt-get update
RUN apt-get install -y ffmpeg \
                       libsm6 \
                       libxext6 \
                       wget \
                       git \
                       build-essential \
                       && rm -rf /var/lib/apt/lists/*

RUN mkdir /app
WORKDIR /app

COPY ./requirements.txt /app/requirements.txt
RUN pip install -r /app/requirements.txt
# RUN pip install humanfriendly \
#                 pandas \
#                 sqlalchemy==1.4.47 \
#                 psycopg2-binary \
#                 matplotlib \
#                 seaborn==0.11.0 \
#                 PyYAML==6.0 \
#                 jsonpickle \
#                 opencv-python \
#                 boto3

RUN mkdir lib
RUN cd lib && git clone https://github.com/microsoft/CameraTraps.git cameratraps
RUN cd lib/cameratraps && git checkout 0d2e372aa6863b22db1e9e7224b90cdf5562bab9
RUN cd lib && git clone https://github.com/ecologize/yolov5.git yolov5
RUN cd lib/yolov5 && git checkout ad033704d1a826e70cd365749e1bb01f1ea8282a

RUN mkdir model
RUN wget -O model/md_v5a.0.0.pt https://github.com/microsoft/CameraTraps/releases/download/v5.0/md_v5a.0.0.pt
RUN wget -O model/md_v5b.0.0.pt https://github.com/microsoft/CameraTraps/releases/download/v5.0/md_v5b.0.0.pt

COPY *.py /app/
ENV PYTHONPATH=/app/lib/yolov5:/app/lib/cameratraps

CMD ["python", "detect-imageset.js"]
