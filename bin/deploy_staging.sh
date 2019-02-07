#!/bin/bash

rm -rf .asset-cache _site
JEKYLL_ENV=production bundle exec jekyll build
rsync -av --delete --no-perms -I -O _site/ staging01:/var/www/afct/
rm -rf _site/
