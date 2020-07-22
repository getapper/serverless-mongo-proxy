class ServerlessMongoProxy {
  serverless: any
  options: any
  commands: any
  hooks: any
  proxyFunctionName = '_serverless-mongo-proxy'

  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;
    this.commands = {
      // @TODO add lifecycle events
    };
    this.hooks = {
      'before:offline:start:init': this.createProxy.bind(this),
      'before:offline:start': this.createProxy.bind(this),
      'after:package:createDeploymentArtifacts': this.createProxy.bind(this),
    };
  }

  createProxy() {
    const options = this.getResolvedStageAndRegion();
    this.serverless.service.functions[this.proxyFunctionName] = {
      handler: 'node_modules/serverless-mongo-proxy/dist/proxy.default',
      name: `${this.serverless.service.service}-${options.stage}-${this.proxyFunctionName}`,
    };
  }

  getResolvedStageAndRegion() {
    return {
      stage: this.options.stage
        || this.serverless.service.provider.stage
        || (this.serverless.service.defaults && this.serverless.service.defaults.stage)
        || 'dev',
      region: this.options.region
        || this.serverless.service.provider.region
        || (this.serverless.service.defaults && this.serverless.service.defaults.region)
        || 'us-east-1',
    };
  }
}

export = ServerlessMongoProxy;
