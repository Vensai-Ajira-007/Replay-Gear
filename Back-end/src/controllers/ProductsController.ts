import {
  Authorized,
  BadRequestError,
  Body,
  Delete,
  Get,
  HttpCode,
  JsonController,
  NotFoundError,
  Param,
  Post,
  Put,
  QueryParam,
} from 'routing-controllers'
import {
  createProduct,
  deleteProduct,
  getProductById,
  queryProducts,
  updateProduct,
  type NewProduct,
  type SortKey,
  type TypeFilter,
  type UpdateProduct,
} from '../services/catalog.js'

@JsonController('/products')
export class ProductsController {
  // GET /api/products?search=&type=&platform=&console=&sort=&featured=  (public)
  @Get('/')
  async list(
    @QueryParam('search') search?: string,
    @QueryParam('type') type?: string,
    @QueryParam('platform') platform?: string,
    // Bound as consoleModel so it doesn't shadow the global `console`.
    @QueryParam('console') consoleModel?: string,
    @QueryParam('sort') sort?: string,
    // Arrives as a string like every other query param (classTransformer is off),
    // so compare rather than declaring it boolean.
    @QueryParam('featured') featured?: string,
  ) {
    const products = await queryProducts({
      search,
      type: type as TypeFilter | undefined,
      platform,
      console: consoleModel,
      sort: sort as SortKey | undefined,
      featured: featured === 'true',
    })
    return { products, count: products.length }
  }

  // GET /api/products/:id  (public)
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

  // POST /api/products  (admin only) — add a product
  @Post('/')
  @HttpCode(201)
  @Authorized('admin')
  async create(@Body() body: NewProduct) {
    const product = await createProduct(body)
    return { product }
  }

  // PUT /api/products/:id  (admin only) — update an existing product
  @Put('/:id')
  @Authorized('admin')
  async update(@Param('id') id: string, @Body() body: UpdateProduct) {
    const numericId = Number(id)
    if (!Number.isInteger(numericId)) {
      throw new BadRequestError('Invalid product id')
    }
    const product = await updateProduct(numericId, body)
    if (!product) throw new NotFoundError('Product not found')
    return { product }
  }

  // DELETE /api/products/:id  (admin only)
  @Delete('/:id')
  @Authorized('admin')
  async remove(@Param('id') id: string) {
    const numericId = Number(id)
    if (!Number.isInteger(numericId)) {
      throw new BadRequestError('Invalid product id')
    }
    const removed = await deleteProduct(numericId)
    if (!removed) throw new NotFoundError('Product not found')
    return { ok: true }
  }
}
