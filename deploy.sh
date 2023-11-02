echo "-----BEGIN OPENSSH PRIVATE KEY-----" >> /tmp/id_rsa
echo $SSH_PRIVATE_KEY >> /tmp/id_rsa
echo "-----END OPENSSH PRIVATE KEY-----" >> /tmp/id_rsa
chmod 600 /tmp/id_rsa

apk update
apk add openssh

SSH_OPTS="-o StrictHostKeyChecking=no -i /tmp/id_rsa"

ssh $SSH_OPTS "yes | cp -r frontend_build/* /usr/share/nginx/html/"
