ibgib init --space-name=local_laptop_ibgib

ibgib b2-init

ibgib b2-branch . --add --name=ibgib-main

ibgib secret --add --name="default_secret" --secret-type=password --space-name="local_laptop_ibgib" --hint="some hint i do not remember" --description="some description" --prompt

ibgib encryption --add --name='default_encryption' --encryption-method=encrypt-gib --space-name='local_laptop_ibgib' --description='default encryption parameterization.' --hash-algorithm='SHA-256' --initial-recursions=50000 --recursions-per-hash=3 --salt-strategy='appendPerHash' --block-mode=true --block-size=10000000 --num-of-passes=10

ibgib sync --add --name='default_syncspace' --desc='this is the first attempted sync space for vcs-gib for actual ibgib code.' --aws-dynamodb --space-name='local_laptop_ibgib' --input-path='sync_space_settings.private' --encryption-name=default_encryption --secret-name=default_secret
