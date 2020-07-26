import path from 'path';
import { copyFileSync, mkdirSync, rmdirSync } from 'fs';

class ServerlessMongoProxy {
  serverless: any
  options: any
  commands: any
  hooks: any
  proxyFunctionName = '_serverless-mongo-proxy'
  outputFolder = '_mongo-proxy'
  config: any

  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;
    this.config = this.serverless.service?.custom['mongo-proxy'];
    this.commands = {};
    this.hooks = {
      'before:offline:start:init': this.beforeOfflineStart.bind(this),
      'before:offline:start': this.beforeOfflineStart.bind(this),
      'after:package:initialize': this.afterPackageInitialize.bind(this),
      'after:package:createDeploymentArtifacts': this.afterCreateDeploymentArtifacts.bind(this),
    };
    this.setEnvVariables();
  }

  afterPackageInitialize() {
    mkdirSync(this.outputFolder, { recursive: true });
    copyFileSync(path.join(__dirname, 'proxy.js'), path.join(this.outputFolder, 'proxy.js'));
    this.createProxy(this.outputFolder);
  }

  afterCreateDeploymentArtifacts() {
    rmdirSync(this.outputFolder, { recursive: true });
  }

  beforeOfflineStart() {
    this.createProxy(path.join('node_modules', 'serverless-mongo-proxy', 'dist'));
  }

  createProxy(handlerFolder: string) {
    const stage = this.getResolvedStage();
    this.serverless.service.functions[this.proxyFunctionName] = {
      handler: path.join(handlerFolder, 'proxy.default'),
      name: `${this.serverless.service.service}-${stage}-${this.proxyFunctionName}`,
      events: [],
    };
  }

  getResolvedStage() {
    return this.options.stage ||
      this.serverless.service.provider.stage ||
      (this.serverless.service.defaults && this.serverless.service.defaults.stage) ||
      'dev';
  }

  setEnvVariables() {
    process.env['MONGO_URI'] = process.env['MONGO_URI'] || this.config.mongoUri || 'mongodb://localhost:27017';
    this.serverless.service.provider.environment['MONGO_URI'] = process.env['MONGO_URI'];
  }
}

export = ServerlessMongoProxy;
