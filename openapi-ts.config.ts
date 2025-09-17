import { defineConfig } from '@hey-api/openapi-ts'

export default defineConfig({
  input: 'https://ocotillo-api-staging.newmexicowaterdata.org/openapi-auth.json',
  output: {path: './src/generated', clean: true},
  plugins: [
    {
        name: 'zod',
        definitions: true,
        requests: true,
        responses: true,
        dates: {offset: true, local: false},
        metadata: false,
        types: {infer: false}
    },
    '@hey-api/typescript',
  ],
})