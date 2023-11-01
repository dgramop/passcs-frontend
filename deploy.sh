echo $SSH_PRIVATE_KEY > "/tmp/id_rsa"
ssh -i /tmp/id_rsa "yes | cp -r frontend_build/* /usr/share/nginx/html/"
