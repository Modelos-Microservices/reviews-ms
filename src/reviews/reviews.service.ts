import { Inject, Injectable, Logger } from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/common/prisma.service';
import { NATS_SERVICE } from 'src/conf/services';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(NATS_SERVICE) private readonly client: ClientProxy
  ) { }

  private readonly logger = new Logger(ReviewsService.name);
  /**
   * Comprueba si un producto existe consultando otro servicio via NATS.
   * @param productId El ID del producto a comprobar.
   * @returns El producto si existe.
   * @throws RpcException si el producto no se encuentra.
   */
  async comprobateProductExists(productId: number) {
    this.logger.log(`Checking if product with ID ${productId} exists...`);
    try {
      const product = await firstValueFrom(
        this.client.send({ cmd: 'get_one_product' }, { id: productId })
      );

      if (!product) {
        throw new RpcException({ status: 404, message: 'Product not found' });
      }

      return product;
    } catch (error) {
      // Manejar posibles errores de comunicación con el servicio NATS
      if (error instanceof RpcException) {
        // Si el error ya es un RpcException (ej: 404 del otro servicio), re-lanzarlo
        throw error;
      }
      console.error('Error communicating with product service:', error);
      // Puedes lanzar un error genérico o específico para problemas de comunicación
      throw new RpcException({ status: 500, message: 'Error checking product existence' });
    }
  }

  async create(createReviewDto: CreateReviewDto) {
    const { product_id, ...data } = createReviewDto;
    // Comprobamos si el producto existe antes de crear la reseña
    await this.comprobateProductExists(product_id);

    //como un usuario solo puede resear un solo producto primero vamos a ver si ya existe una reseña para ese producto
    const existingReview = await this.prisma.review.findFirst({
      where: { product_id: product_id },
    });

    if (existingReview?.user_id === data.user_id) {
      throw new RpcException({ status: 400, message: 'User has already reviewed this product' });
    }


    try {

      const review = await this.prisma.review.create({
        data: {
          ...data,
          product_id: product_id,
          // Asegúrate de que user_id esté presente en 'data' o lo obtengas de otra fuente (ej: contexto de autenticación)
          // Si user_id viene en createReviewDto, ya está en 'data' debido al spread ...data
        },
      });
      return review;
    } catch (error) {
      // Manejar posibles errores de base de datos al crear la reseña
      console.error('Error creating review:', error);
      // Aquí podrías añadir más granularidad de errores si es necesario (ej: unique constraint errors)
      throw new RpcException({ status: 500, message: 'Failed to create review' });
    }
  }

  /**
   * Obtiene todas las reseñas.
   * @returns Un array de reseñas.
   */
  async findAll() {
    try {
      const reviews = await this.prisma.review.findMany();
      return reviews;
    } catch (error) {
      console.error('Error fetching all reviews:', error);
      throw new RpcException({ status: 500, message: 'Failed to fetch reviews' });
    }
  }

  /**
   * Busca una reseña por su ID (UUID).
   * @param id El ID (UUID) de la reseña a buscar.
   * @returns La reseña encontrada.
   * @throws RpcException si la reseña no se encuentra.
   */
  async findOne(id: string) {
    // No es necesario validar si es un número, pero podrías validar si es un formato UUID si quisieras
    // Una validación simple podría ser `if (typeof id !== 'string' || id.length === 0)`
    if (typeof id !== 'string' || id.length === 0) {
      throw new RpcException({ status: 400, message: 'Invalid Review ID format' });
    }

    try {
      const review = await this.prisma.review.findUnique({
        where: { id: id },
      });

      if (!review) {
        throw new RpcException({ status: 404, message: `Review with id ${id} not found` });
      }
      return review;
    } catch (error) {
      if (error instanceof RpcException) {
        throw error; // Re-lanzar el error 404 si es nuestro
      }
      console.error(`Error fetching review with id ${id}:`, error);
      // Prisma podría lanzar otros errores si el ID no es válido para la DB (aunque string lo acepta)
      throw new RpcException({ status: 500, message: `Failed to fetch review with id ${id}` });
    }
  }

  /**
   * Actualiza una reseña existente por su ID (UUID).
   * @param id El ID (UUID) de la reseña a actualizar.
   * @param updateReviewDto Los datos para actualizar la reseña.
   * @returns La reseña actualizada.
   * @throws RpcException si la reseña no se encuentra.
   */
  async update(id: string, updateReviewDto: UpdateReviewDto) {
    if (typeof id !== 'string' || id.length === 0) {
      throw new RpcException({ status: 400, message: 'Invalid Review ID format' });
    }
    try {
      const updatedReview = await this.prisma.review.update({
        where: { id: id },
        data: updateReviewDto,
      });
      return updatedReview;
    } catch (error) {
      // Prisma arroja P2025 si el registro a actualizar no existe
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new RpcException({ status: 404, message: `Review with id ${id} not found` });
        }
      }
      console.error(`Error updating review with id ${id}:`, error);
      throw new RpcException({ status: 500, message: `Failed to update review with id ${id}` });
    }
  }

  /**
   * Elimina una reseña por su ID (UUID).
   * @param id El ID (UUID) de la reseña a eliminar.
   * @returns La reseña eliminada.
   * @throws RpcException si la reseña no se encuentra.
   */
  async remove(id: string) {
    if (typeof id !== 'string' || id.length === 0) {
      throw new RpcException({ status: 400, message: 'Invalid Review ID format' });
    }
    try {
      const deletedReview = await this.prisma.review.delete({
        where: { id: id },
      });
      return deletedReview; // Prisma devuelve el objeto eliminado
    } catch (error) {
      // Prisma arroja P2025 si el registro a eliminar no existe
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new RpcException({ status: 404, message: `Review with id ${id} not found` });
        }
      }
      console.error(`Error deleting review with id ${id}:`, error);
      throw new RpcException({ status: 500, message: `Failed to delete review with id ${id}` });
    }
  }
}