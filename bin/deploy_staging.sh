#!/bin/bash

rsync -av --delete --no-perms -I -O _site/ 173.212.192.127:/var/www/afct/
