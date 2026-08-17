import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { Like, Repository } from 'typeorm';
import { CategoriaInsumo } from 'database/entities/bodega/categoria-insumo.entity';
import { BaseService } from 'src/common';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { CreateCategoriaInsumoDto, UpdateCategoriaInsumoDto } from '../dto/categoria-insumo.dto';

@Injectable()
export class CategoriasInsumoService extends BaseService {
  constructor(
    @Inject('CATEGORIA_INSUMO_REPOSITORY')
    private readonly categoriaRepository: Repository<CategoriaInsumo>,
  ) {
    super();
  }

  protected readonly logger = new Logger('CategoriasInsumoService');

  async create(createDto: CreateCategoriaInsumoDto) {
    try {
      const categoria = this.categoriaRepository.create(createDto);
      const saved = await this.categoriaRepository.save(categoria);
      return this.customSuccessResponse(
        saved,
        null,
        HttpStatus.CREATED,
        'Categoría de insumo creada exitosamente',
        'bodega/categorias',
      );
    } catch (error) {
      this.customThrowError(error, 'BOD-10', 'Error al crear categoría de insumo');
    }
  }

  async findAll(paginationDto: PaginationDto) {
    try {
      const { page, limit, busqueda } = paginationDto;
      const [data, total] = await this.categoriaRepository.findAndCount({
        where: busqueda ? { nombre: Like(`%${busqueda}%`) } : {},
        skip: (page - 1) * limit,
        take: limit,
        order: { nombre: 'ASC' },
      });
      return this.customSuccessResponse(
        data,
        { total, page, limit },
        HttpStatus.OK,
        'Categorías de insumo listadas correctamente',
        'bodega/categorias',
      );
    } catch (error) {
      this.customThrowError(error, 'BOD-11', 'Error al listar categorías de insumo');
    }
  }

  async findOne(id: string) {
    try {
      const data = await this.categoriaRepository.findOneBy({ id });
      if (!data) {
        return this.customThrowError(null, 'BOD-12-01', `Categoría de insumo con ID ${id} no encontrada`);
      }
      return this.customSuccessResponse(
        data,
        null,
        HttpStatus.OK,
        'Categoría de insumo encontrada',
        'bodega/categorias',
      );
    } catch (error) {
      this.customThrowError(error, 'BOD-12', 'Error al buscar categoría de insumo');
    }
  }

  async update(id: string, updateDto: UpdateCategoriaInsumoDto) {
    try {
      // 1. Verificamos si existe la categoría
      const categoria = await this.categoriaRepository.findOneBy({ id });
      if (!categoria) {
        return this.customThrowError(null, 'BOD-13-01', `Categoría de insumo con ID ${id} no encontrada`);
      }

      // 2. Limpiamos el DTO de campos que no deben actualizarse (como el id)
      const { id: _, ...dataToUpdate } = updateDto;

      // 3. Verificamos si hay campos para actualizar
      if (Object.keys(dataToUpdate).length === 0) {
        return this.customSuccessResponse(
          categoria,
          null,
          HttpStatus.OK,
          'No se detectaron cambios para actualizar',
          'bodega/categorias',
        );
      }

      // 4. Ejecutamos la actualización
      await this.categoriaRepository.update(id, dataToUpdate);
      
      const updated = await this.categoriaRepository.findOneBy({ id });
      return this.customSuccessResponse(
        updated,
        null,
        HttpStatus.OK,
        'Categoría de insumo actualizada correctamente',
        'bodega/categorias',
      );
    } catch (error) {
      this.customThrowError(error, 'BOD-13', 'Error al actualizar categoría de insumo');
    }
  }

  async remove(id: string) {
    try {
      const exists = await this.categoriaRepository.findOneBy({ id });
      if (!exists) {
        return this.customThrowError(null, 'BOD-14-01', `Categoría de insumo con ID ${id} no encontrada`);
      }
      await this.categoriaRepository.delete(id);
      return this.customSuccessResponse(
        null,
        null,
        HttpStatus.OK,
        'Categoría de insumo eliminada exitosamente',
        'bodega/categorias',
      );
    } catch (error) {
      this.customThrowError(error, 'BOD-14', 'Error al eliminar categoría de insumo');
    }
  }
}
