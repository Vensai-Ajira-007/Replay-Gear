import {
  BadRequestError,
  Body,
  Delete,
  Get,
  HttpCode,
  JsonController,
  NotFoundError,
  Param,
  Patch,
  Post,
} from 'routing-controllers'
import {
  addItem,
  clearCart,
  getCart,
  removeItem,
  setItem,
} from '../store/cart.js'

interface AddToCartBody {
  productId: number
  qty?: number
}

interface UpdateQtyBody {
  qty: number
}

@JsonController('/cart')
export class CartController {
  // GET /api/cart
  @Get('/')
  async view() {
    return { cart: await getCart() }
  }

  // POST /api/cart  body: { productId, qty? }
  @Post('/')
  @HttpCode(201)
  async add(@Body() body: AddToCartBody) {
    const id = Number(body?.productId)
    if (!Number.isInteger(id)) {
      throw new BadRequestError('productId (integer) is required')
    }
    const qty = Number(body?.qty) > 0 ? Number(body.qty) : 1
    if (!(await addItem(id, qty))) {
      throw new NotFoundError('Product not found')
    }
    return { cart: await getCart() }
  }

  // PATCH /api/cart/:productId  body: { qty } — set absolute quantity (0 removes)
  @Patch('/:productId')
  async updateQty(
    @Param('productId') productId: string,
    @Body() body: UpdateQtyBody,
  ) {
    const id = Number(productId)
    if (!Number.isInteger(id)) {
      throw new BadRequestError('Invalid product id')
    }
    await setItem(id, Number(body?.qty))
    return { cart: await getCart() }
  }

  // DELETE /api/cart/:productId — remove one line
  // @Param arrives as a string (classTransformer is off), so coerce explicitly.
  @Delete('/:productId')
  async remove(@Param('productId') productId: string) {
    const id = Number(productId)
    if (!Number.isInteger(id)) {
      throw new BadRequestError('Invalid product id')
    }
    removeItem(id)
    return { cart: await getCart() }
  }

  // DELETE /api/cart — clear everything
  @Delete('/')
  async clear() {
    clearCart()
    return { cart: await getCart() }
  }
}
