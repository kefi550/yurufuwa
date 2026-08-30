import * as cdk from 'aws-cdk-lib/core';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'Vpc', {
      maxAzs: 2,
      natGateways: 0,
    });

    const securityGroup = new ec2.SecurityGroup(this, 'InstanceSecurityGroup', {
      vpc,
      description: 'Allow SSH and HTTP inbound traffic',
      allowAllOutbound: true,
    });

    securityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.allTcp(),
    );

    const allowedIps = [
      '210.165.202.134/32',
      '14.13.129.0/32',
    ];
    for (const ip of allowedIps) {
      securityGroup.addIngressRule(
        ec2.Peer.ipv4(ip),
        ec2.Port.tcp(22),
        'Allow SSH',
      );
      securityGroup.addIngressRule(
        ec2.Peer.ipv4(ip),
        ec2.Port.tcp(80),
        'Allow HTTP',
      );
    }

    const keyPair = ec2.KeyPair.fromKeyPairName(this, 'KeyPair', 'kefikey');

    const appUserData = ec2.UserData.forLinux();
    appUserData.addCommands(
      // isucon9 quolify
      'sudo apt update -y',
      'sudo apt install ca-certificates curl',
      'sudo install -m 0755 -d /etc/apt/keyrings',
      'sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc',
      'sudo chmod a+r /etc/apt/keyrings/docker.asc',
      'sudo tee /etc/apt/sources.list.d/docker.sources <<EOF\n' +
        'Types: deb\n' +
        'URIs: https://download.docker.com/linux/ubuntu\n' +
        'Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")\n' +
        'Components: stable\n' +
        'Architectures: $(dpkg --print-architecture)\n' +
        'Signed-By: /etc/apt/keyrings/docker.asc\n' +
        'EOF',
      'sudo apt update -y',
      'sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin -y',
      'sudo systemctl start docker',
      'sudo usremod -aG docker isucon',
      'sudo chmod 666 /var/run/docker.sock',
    );

    const appInstance = new ec2.Instance(this, 'AppInstance', {
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.C7A, ec2.InstanceSize.LARGE),
      machineImage: ec2.MachineImage.genericLinux({
        'ap-northeast-1': 'ami-03b1b78bb1da5122f',
      }),
      securityGroup,
      keyPair,
      userData: appUserData,
    });

    new cdk.CfnOutput(this, 'AppInstanceIp', {
      value: appInstance.instancePublicIp,
    });
  }
}
