FROM leanlabs/base-builder

MAINTAINER V <v.tyubek@gmail.com>

RUN apk add --update \
        php-json \
        php-phar \
        php-ctype && \
    wget http://raml2html.leanlabs.io/raml2html.phar -O /raml2html.phar && \
    chmod +x /raml2html.phar

ENTRYPOINT ["/raml2html.phar"]

