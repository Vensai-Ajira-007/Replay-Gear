import { Get, JsonController } from 'routing-controllers'

@JsonController()
export class HealthController {
  // GET /api/health
  @Get('/health')
  check() {
    return { status: 'ok', service: 'replaygear-api' }
  }
}
