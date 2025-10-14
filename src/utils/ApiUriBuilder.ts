// Example Usage:
// const apiUrl = new AmpApiUriBuilder(settings.nmbgmr_api_url)
//   .setEndpoint("data")
//   .addParam("id", "12345")
//   .build();
// console.log(apiUrl); // Outputs: settings.nmbgmr_api_url/v1/data?id=12345

export class ApiUriBuilder {
  private baseUrl: string
  private endpoint: string
  private params: URLSearchParams

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
    this.endpoint = ''
    this.params = new URLSearchParams()
  }

  setEndpoint(endpoint: string): this {
    this.endpoint = endpoint
    return this
  }

  addParam(key: string, value: string): this {
    this.params.append(key, value)
    return this
  }

  build(): string {
    const paramString = this.params.toString()
    return `${this.baseUrl}/${this.endpoint}${paramString ? `?${paramString}` : ''}`
  }
}
