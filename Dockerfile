FROM ubuntu:latest
MAINTAINER "jayden.park@paust.io"
RUN apt-get update \
 && apt-get install -y python3.6 python3.6-dev python3-pip \
 && cd /usr/local/bin \
 && ln -s /usr/bin/python3 python \
 && pip3 install --upgrade pip

COPY . /app
WORKDIR /app
RUN pip3 install -r requirements.txt

EXPOSE 5000
