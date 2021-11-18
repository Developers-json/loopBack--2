import {service} from '@loopback/core';
import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where
} from '@loopback/repository';
import {
  del, get,
  getModelSchemaRef, HttpErrors, param, patch, post, put, requestBody,
  response
} from '@loopback/rest';
import {keys} from '../config/keys';
//import fetch from "node-fetch";
import {CambioClabe, Credenciales, Persona, RecuperarClave} from '../models';
import {PersonaRepository} from '../repositories';
import {AutenticacionService} from '../services';
const fetch = require("node-fetch")

export class PersonaController {
  constructor(
    @repository(PersonaRepository)
    public personaRepository: PersonaRepository,
    @service(AutenticacionService)
    public servicioAutenticacion: AutenticacionService
  ) { }

  @post('/login')
  @response(200, {
    description: "Identificacion de usuarios"
  })
  async loginPersonas(
    @requestBody() Credenciales: Credenciales
  ) {
    const p = await this.servicioAutenticacion.IdentificarPersona(Credenciales.Usuario, Credenciales.Clave)
    if (p) {
      const token = this.servicioAutenticacion.GenerarTokenJWT(p)
      return {
        datos: {
          id: p.id,
          nombre: p.Nombre,
          correo: p.Correo,
          telefono: p.Celular
        },
        tk: token
      }
    } else {
      throw new HttpErrors[404]("Datos invalidos")
    }
  }

  @post('/cambio-clave')
  @response(200, {
    description: "Se genera un codigo para validar el cambio de contraseña"
  })
  async ValidarCambioClave(
    @requestBody() CambioClave: CambioClabe
  ): Promise<Boolean> {
    const usuario = await this.personaRepository.findOne({
      where: {
        Correo: CambioClave.correo
      }
    })
    if (usuario) {
      const codigo = this.servicioAutenticacion.GenerarCodigo()
      usuario.Codigo = codigo
      await this.personaRepository.updateById(usuario.id, usuario)
      //Se envio la clave al celular del usuario
      const destino = usuario.Celular
      const contenido = `Hola ${usuario.Nombre + " " + usuario.Apellido}, te enviamos el codigo de verificacion para el cambio de contraseña: ${usuario.Codigo}`
      await fetch(`${keys.urlServicioNotificaciones}/sms?mensaje=${contenido}&telefono=${destino}`)
        .then((data: any) => {
          console.log(data)
        })
      return true
    }
    return false
  }

  @post('/recuperar-clave')
  @response(200, {
    description: "Recuperar clave del usuario"
  })
  async RecuperarClave(
    @requestBody() RecuperClave: RecuperarClave
  ): Promise<Boolean> {
    const usuario = await this.personaRepository.findOne({
      where: {
        Correo: RecuperClave.correo
      }
    })
    if (usuario) {
      if (usuario.Codigo == RecuperClave.codigo) {
        const claveEncriptada = this.servicioAutenticacion.EncriptarClave(RecuperClave.password)
        usuario.Clave = claveEncriptada
        await this.personaRepository.updateById(usuario.id, usuario)
        //Se notifica al usuario sobre el cambio de la cuenta por correo
        const destino = usuario.Correo
        const asunto = 'Notificacion de Cambio de contraseña en la plataforma'
        const contenido = `Hola ${usuario.Nombre + " " + usuario.Apellido}, te notificamos que se ha cambiado la contraseña de tu cuenta con el nombre de usuario: ${usuario.Correo}`
        await fetch(`${keys.urlServicioNotificaciones}/mailSMTP?email=${destino}&asunto=${asunto}&mensaje=${contenido}`)
          .then((data: any) => {
            console.log(data)
          })
        return true
      } else {
        return false
      }
    }
    return false
  }

  @post('/personas')
  @response(200, {
    description: 'Persona model instance',
    content: {'application/json': {schema: getModelSchemaRef(Persona)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Persona, {
            title: 'NewPersona',
            exclude: ['id'],
          }),
        },
      },
    })
    persona: Omit<Persona, 'id'>,
  ): Promise<Persona> {
    //const clave = this.servicioAutenticacion.GenerarClave();
    const claveEncriptada = this.servicioAutenticacion.EncriptarClave(persona.Clave);
    persona.Clave = claveEncriptada;
    const person = await this.personaRepository.create(persona);
    //Se notifica al usuario sobre la creacion de la cuenta por correo
    const destino = persona.Correo
    const asunto = 'Notificacion de registro en la plataforma'
    const contenido = `Hola ${persona.Nombre + " " + persona.Apellido}, te notificamos que se ha creado una cuenta con el nombre de usuario: ${persona.Correo}`
    await fetch(`${keys.urlServicioNotificaciones}/mailSMTP?email=${destino}&asunto=${asunto}&mensaje=${contenido}`)
      .then((data: any) => {
        console.log(data)
      })
    return person;
  }

  @get('/personas/count')
  @response(200, {
    description: 'Persona model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Persona) where?: Where<Persona>,
  ): Promise<Count> {
    return this.personaRepository.count(where);
  }

  @get('/personas')
  @response(200, {
    description: 'Array of Persona model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Persona, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Persona) filter?: Filter<Persona>,
  ): Promise<Persona[]> {
    return this.personaRepository.find(filter);
  }

  @patch('/personas')
  @response(200, {
    description: 'Persona PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Persona, {partial: true}),
        },
      },
    })
    persona: Persona,
    @param.where(Persona) where?: Where<Persona>,
  ): Promise<Count> {
    return this.personaRepository.updateAll(persona, where);
  }

  @get('/personas/{id}')
  @response(200, {
    description: 'Persona model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Persona, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Persona, {exclude: 'where'}) filter?: FilterExcludingWhere<Persona>
  ): Promise<Persona> {
    return this.personaRepository.findById(id, filter);
  }

  @patch('/personas/{id}')
  @response(204, {
    description: 'Persona PATCH success',
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Persona, {partial: true}),
        },
      },
    })
    persona: Persona,
  ): Promise<void> {
    await this.personaRepository.updateById(id, persona);
  }

  @put('/personas/{id}')
  @response(204, {
    description: 'Persona PUT success',
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() persona: Persona,
  ): Promise<void> {
    await this.personaRepository.replaceById(id, persona);
  }

  @del('/personas/{id}')
  @response(204, {
    description: 'Persona DELETE success',
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.personaRepository.deleteById(id);
  }
}
