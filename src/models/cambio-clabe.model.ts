import {Model, model, property} from '@loopback/repository';

@model()
export class CambioClabe extends Model {
  @property({
    type: 'string',
    id: true,
    generated: true,
  })
  id?: string;

  @property({
    type: 'string',
    required: true,
  })
  correo: string;


  constructor(data?: Partial<CambioClabe>) {
    super(data);
  }
}

export interface CambioClabeRelations {
  // describe navigational properties here
}

export type CambioClabeWithRelations = CambioClabe & CambioClabeRelations;
