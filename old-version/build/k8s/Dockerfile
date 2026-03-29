FROM node:14

WORKDIR /home/node/exec_env

ARG BRANCH_NAME=master
ARG CONTACT_LINE

ADD build/k8s/logging-config.json /etc
ADD build/k8s/entry_point.sh /home/node/exec_env
RUN echo "Email: $CONTACT_LINE" > /etc/linky-contact.txt

ADD https://api.github.com/repos/oglimmer/linky/git/refs/heads/$BRANCH_NAME /tmp/version.json

RUN mkdir -p /home/node/exec_env /var/log/linky /var/cache/linky /var/cache/linky-archive /home/node/build_env && \
	git clone https://github.com/oglimmer/linky.git --branch $BRANCH_NAME --depth 1 /home/node/build_env && \
	cd /home/node/build_env && \
	npm install && \
	npm run build && \
	cp -r dist/ server/ src/ link-check-server/ package.json .babelrc ../exec_env && \
	rm -rf /home/node/build_env && \
	cd /home/node/exec_env && \
	npm i --save-prod

ENV LINKY_PROPERTIES /etc/linky/linky.properties
ENV LINKY_CONTACT /etc/linky/linky-contact.txt
ENV NODE_ENV production
#ENV PROXY_PORT 8080
#ENV PROXY_BIND 0.0.0.0
ENV PORT 8080
ENV BIND 0.0.0.0

EXPOSE 8080

VOLUME [ "/etc/linky" ]

ENTRYPOINT [ "./entry_point.sh" ]

CMD ["server"]
