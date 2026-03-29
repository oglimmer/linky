FROM ubuntu:16.04

RUN apt-get update && \
    apt-get -qy install git apt-transport-https curl && \
    curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - && \
    echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list && \
    curl -sL https://deb.nodesource.com/setup_7.x|bash -s && \
    apt-get update && \
    apt-get -qy install nodejs yarn python make g++ && \
    apt-get clean && \
    rm -rf /tmp/* /var/tmp/* /var/lib/apt/archive/* /var/lib/apt/lists/*

WORKDIR /home/build

ADD entrypoint.sh /home/build

CMD ["./entrypoint.sh"]
