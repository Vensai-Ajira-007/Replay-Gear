import {
  BadRequestError,
  Body,
  Delete,
  Get,
  HttpCode,
  JsonController,
  NotFoundError,
  Param,
  Post,
} from 'routing-controllers'
import { addItem, clearCart, getCart, removeItem } from '../store/cart.js'

interface AddToCartBody {
  productId: number
  qty?: number
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
