#!/bin/bash

source .rbenv-vars

FTPURL="ftp://$FTP_USER:$FTP_PASS@$FTP_HOST"
LCD="./_site"
RCD="/"
lftp -c "set ftp:list-options -a;
set ftp:ssl-allow no;
open '$FTPURL';
lcd $LCD;
cd $RCD;
mirror --reverse --delete --use-cache --verbose --allow-chown --allow-suid --no-umask --parallel=2 --exclude-glob .git"
