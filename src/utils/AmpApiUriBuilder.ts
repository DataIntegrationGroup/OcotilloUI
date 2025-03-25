// Example Usage:
// const apiUrl = new AmpApiUriBuilder(settings.nmbgmr_api_url)
//   .setVersion("v1")
//   .setEndpoint("data")
//   .addParam("id", "12345")
//   .build();
// console.log(apiUrl); // Outputs: settings.nmbgmr_api_url/v1/data?id=12345

export class AmpApiUriBuilder {
  private baseUrl: string;
  private version: string;
  private endpoint: string;
  private params: URLSearchParams;

  constructor(baseUrl: string, version: string = "v0") {
    this.baseUrl = baseUrl;
    this.version = version;
    this.endpoint = "";
    this.params = new URLSearchParams();
  }

  setVersion(version: string): this {
    this.version = version;
    return this;
  }

  setEndpoint(endpoint: string): this {
    this.endpoint = endpoint;
    return this;
  }

  addParam(key: string, value: string): this {
    this.params.append(key, value);
    return this;
  }

  build(): string {
    const paramString = this.params.toString();
    return `${this.baseUrl}/${this.version}/${this.endpoint}${paramString ? `?${paramString}` : ""}`;
  }
}
