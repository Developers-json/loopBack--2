import { /* inject, */ BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {keys} from '../config/keys';
import {Persona} from '../models';
import {PersonaRepository} from '../repositories';
const CryptoJS = require("crypto-js");
const generatePassword = require("password-generator");
const jwt = require('jsonwebtoken');

@injectable({scope: BindingScope.TRANSIENT})
export class AutenticacionService {
  constructor(
    @repository(PersonaRepository)
    public personaRepository: PersonaRepository
  ) { }

  GenerarClave() {
    var maxLength = 18;
    var minLength = 12;
    var password = "";

    var randomLength = Math.floor(Math.random() * (maxLength - minLength)) + minLength;
    while (!isStrongEnough(password)) {
      password = generatePassword(randomLength, false, /[\w\d\?\-]/);
    }
    return password;
  }
  EncriptarClave(clave: string) {
    return CryptoJS.MD5(clave).toString();
  }

  GenerarCodigo() {
    var maxLength = 10;
    var minLength = 6;
    var password = "";

    var randomLength = Math.floor(Math.random() * (maxLength - minLength)) + minLength;
    password = generatePassword(randomLength, false, /[\w\d\?\-]/);
    return password
  }

  GenerarTokenJWT(persona: Persona) {
    const token = jwt.sign({
      data: {
        id: persona.id,
        correo: persona.Correo,
        telefono: persona.Celular
      }
    },
      keys.claveJWT)
    return token
  }
  ValidarTokenJWT(token: string) {
    try {
      const datos = jwt.verify(token, keys.claveJWT)
      return datos;
    } catch (error) {
      return false
    }
  }
  IdentificarPersona(usuario: string, clave: string) {
    try {
      const p = this.personaRepository.findOne({where: {Correo: usuario, Clave: this.EncriptarClave(clave)}})
      if (p) {
        return p
      }
      return false
    } catch (error) {
      return false
    }
  }
}

function isStrongEnough(password: string) {
  var maxLength = 18;
  var minLength = 12;
  var uppercaseMinCount = 1;
  var lowercaseMinCount = 3;
  var numberMinCount = 1;
  var specialMinCount = 1;
  var UPPERCASE_RE = /([A-Z])/g;
  var LOWERCASE_RE = /([a-z])/g;
  var NUMBER_RE = /([\d])/g;
  var SPECIAL_CHAR_RE = /([\?\-])/g;
  var NON_REPEATING_CHAR_RE = /([\w\d\?\-])\1{2,}/g;

  var uc = password.match(UPPERCASE_RE);
  var lc = password.match(LOWERCASE_RE);
  var n = password.match(NUMBER_RE);
  var sc = password.match(SPECIAL_CHAR_RE);
  var nr = password.match(NON_REPEATING_CHAR_RE);

  return password.length >= minLength
    && !nr
    && uc
    && uc.length >= uppercaseMinCount
    && lc
    && lc.length >= lowercaseMinCount
    && n
    && n.length >= numberMinCount
    && sc
    && sc.length >= specialMinCount;
}
