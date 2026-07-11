import {
  BadRequestError,
  Get,
  JsonController,
  NotFoundError,
  Param,
  QueryParam,
} from 'routing-controllers'
import {
  getProductById,
  queryProducts,
  type SortKey,
  type TypeFilter,
} from '../services/catalog.js'

@JsonController('/products')
export class ProductsController {
  // GET /api/products?search=&type=&platform=&sort=
  @Get('/')
  async list(
    @QueryParam('search') search?: string,
    @QueryParam('type') type?: string,
    @QueryParam('platform') platform?: string,
    @QueryParam('sort') sort?: string,
  ) {
    const products = await queryProducts({
      search,
      type: type as TypeFilter | undefined,
      platform,
      sort: sort as SortKey | undefined,
    })
    return { products, count: products.length }
  }

  // GET /api/products/:id
  // @Param arrives as a string (classTransformer is off), so coerce explicitly.
  @Get('/:id')
  async getOne(@Param('id') id: string) {
    const numericId = Number(id)
    if (!Number.isInteger(numericId)) {
      throw new BadRequestError('Invalid product id')
    }
    const product = await getProductById(numericId)
    if (!product) {
      throw new NotFoundError('Product not found')
    }
    return { product }
  }
}
