echo "-----BEGIN OPENSSH PRIVATE KEY-----" >> /tmp/id_rsa
echo $SSH_PRIVATE_KEY >> /tmp/id_rsa
echo "-----END OPENSSH PRIVATE KEY-----" >> /tmp/id_rsa
chmod 600 /tmp/id_rsa

apk update
apk add openssh

SSH_OPTS="-o StrictHostKeyChecking=no -i /tmp/id_rsa"

scp $SSH_OPTS frontend_build/* root@passcs.io:/home/passcs/frontend_staging
ssh $SSH_OPTS root@passcs.io "yes | cp -r /home/passcs/frontend_staging/* /usr/share/nginx/html/"
