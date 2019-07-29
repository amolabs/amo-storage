FROM ubuntu:latest
MAINTAINER elon "elon.choi@paust.io"
RUN apt-get update \
  && apt-get install -y python3.6 python3.6-dev python3-pip \
  && cd /usr/local/bin \
  && ln -s /usr/bin/python3 python \
  && pip3 install --upgrade pip

COPY . /app
WORKDIR /app
RUN pip3 install -r requirements.txt

EXPOSE 5000
ENV HOST 0.0.0.0
ENV PORT 5000
ENV CONFIG "./config.ini"
CMD python3 main.py --host $HOST --port $PORT --config_path $CONFIG