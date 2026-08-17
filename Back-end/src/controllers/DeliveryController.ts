import { Get, JsonController, QueryParam } from 'routing-controllers'
import { checkPincode } from '../services/delivery.js'

@JsonController('/delivery')
export class DeliveryController {
  // GET /api/delivery/check?pincode=560001  (public)
  // A PIN we don't cover is a 200 with serviceable:false, not an error — only
  // a malformed PIN is a 400 (thrown by the service).
  @Get('/check')
  check(@QueryParam('pincode') pincode?: string) {
    return { delivery: checkPincode(pincode) }
  }
}
