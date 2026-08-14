import {
  Authorized,
  BadRequestError,
  Body,
  CurrentUser,
  Delete,
  Get,
  HeaderParam,
  HttpCode,
  JsonController,
  NotFoundError,
  Param,
  Patch,
  Post,
} from 'routing-controllers'
import type { AccessPayload } from '../auth/tokens.js'
import {
  addItem,
  cartKey,
  clearCart,
  getCart,
  mergeCarts,
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

// Carts are per-owner: a logged-in user's account, or a guest's browser via the
// `x-cart-id` header. Deliberately NOT @Authorized() — guests must be able to
// build a cart before signing in, then claim it via POST /cart/claim.
@JsonController('/cart')
export class CartController {
  // GET /api/cart
  @Get('/')
  async view(
    @CurrentUser() user?: AccessPayload,
    @HeaderParam('x-cart-id') cartId?: string,
  ) {
    return { cart: await getCart(cartKey(user, cartId)) }
  }

  // POST /api/cart  body: { productId, qty? }
  @Post('/')
  @HttpCode(201)
  async add(
    @Body() body: AddToCartBody,
    @CurrentUser() user?: AccessPayload,
    @HeaderParam('x-cart-id') cartId?: string,
  ) {
    const key = cartKey(user, cartId)
    const id = Number(body?.productId)
    if (!Number.isInteger(id)) {
      throw new BadRequestError('productId (integer) is required')
    }
    const qty = Number(body?.qty) > 0 ? Number(body.qty) : 1
    if (!(await addItem(key, id, qty))) {
      throw new NotFoundError('Product not found')
    }
    return { cart: await getCart(key) }
  }

  // PATCH /api/cart/:productId  body: { qty } — set absolute quantity (0 removes)
  @Patch('/:productId')
  async updateQty(
    @Param('productId') productId: string,
    @Body() body: UpdateQtyBody,
    @CurrentUser() user?: AccessPayload,
    @HeaderParam('x-cart-id') cartId?: string,
  ) {
    const key = cartKey(user, cartId)
    const id = Number(productId)
    if (!Number.isInteger(id)) {
      throw new BadRequestError('Invalid product id')
    }
    await setItem(key, id, Number(body?.qty))
    return { cart: await getCart(key) }
  }

  // POST /api/cart/claim — adopt the guest cart into the logged-in user's cart
  @Post('/claim')
  @Authorized()
  async claim(
    @CurrentUser() user: AccessPayload,
    @HeaderParam('x-cart-id') cartId?: string,
  ) {
    const userKey = cartKey(user)
    const guestKey = cartKey(null, cartId)
    mergeCarts(guestKey, userKey)
    return { cart: await getCart(userKey) }
  }

  // DELETE /api/cart/:productId — remove one line
  // @Param arrives as a string (classTransformer is off), so coerce explicitly.
  @Delete('/:productId')
  async remove(
    @Param('productId') productId: string,
    @CurrentUser() user?: AccessPayload,
    @HeaderParam('x-cart-id') cartId?: string,
  ) {
    const key = cartKey(user, cartId)
    const id = Number(productId)
    if (!Number.isInteger(id)) {
      throw new BadRequestError('Invalid product id')
    }
    removeItem(key, id)
    return { cart: await getCart(key) }
  }

  // DELETE /api/cart — clear everything
  @Delete('/')
  async clear(
    @CurrentUser() user?: AccessPayload,
    @HeaderParam('x-cart-id') cartId?: string,
  ) {
    const key = cartKey(user, cartId)
    clearCart(key)
    return { cart: await getCart(key) }
  }
}
