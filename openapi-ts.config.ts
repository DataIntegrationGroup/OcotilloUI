import { defineConfig } from '@hey-api/openapi-ts'

export default defineConfig({
  input: './openapi.json',
  output: './src/generated',
  plugins: [
    {
        name: 'zod',
        definitions: true,
        requests: true,
        responses: true,
        dates: {offset: true, local: false},
        metadata: false,
        types: {infer: false}
    }
  ]
})