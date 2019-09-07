# ansible_docker-ce

- ubuntuにdocker-ceをインストールする

## requirements
- ubuntu 18.04

## usage
`./hosts` に対象のサーバを書く
```hosts
[defaults]
your-server-hostname
```

```
ansible-playbook site.yml
```
