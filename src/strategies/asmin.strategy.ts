import {AuthenticationStrategy} from '@loopback/authentication';
import {service} from '@loopback/core';
import {HttpErrors, Request} from '@loopback/rest';
import {UserProfile} from '@loopback/security';
import parseBearerToken from 'parse-bearer-token';
import {AutenticacionService} from '../services';

export class EstrategiaAdministrador implements AuthenticationStrategy {
  name: string = 'admin';
  perfil: UserProfile;
  constructor(
    @service(AutenticacionService)
    public servicioAutenticacion: AutenticacionService
  ) {

  }

  async authenticate(request: Request): Promise<UserProfile | undefined> {
    const token = parseBearerToken(request)
    if (token) {
      const datos = this.servicioAutenticacion.ValidarTokenJWT(token)
      //console.log(datos)
      if (datos) {
        this.perfil = Object.assign({
          id: datos.data.id,
          correo: datos.data.correo,
          telefono: datos.data.telefono
        })
        //console.log(perfil)
        return this.perfil
      } else {
        throw new HttpErrors[401]("El token incluido no es valido.")
      }

    } else {
      throw new HttpErrors[401]("No se ha incluido un token de autenticacion")
    }
  }
}
