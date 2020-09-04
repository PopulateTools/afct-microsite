#!/bin/bash

rsync -av --delete --no-perms -I -O _site/ 161.97.94.105:/var/www/afct/
