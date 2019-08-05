FROM python:3.6.9-alpine
MAINTAINER "jayden.park@paust.io"

RUN echo "**** install Python ****" && \
    apk add --no-cache gcc musl-dev && \
    pip3 install --no-cache --upgrade pip setuptools wheel

COPY . /app
WORKDIR /app
RUN pip3 install -r requirements.txt
EXPOSE 5000
