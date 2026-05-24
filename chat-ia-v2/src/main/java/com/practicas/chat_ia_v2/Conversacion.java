package com.practicas.chat_ia_v2;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Document(collection = "conversaciones")
public class Conversacion {

    @Id
    private String id;
    private String nombre;
    private List<Mensaje> mensajes;

    public Conversacion() {
        this.mensajes = new ArrayList<>();
    }

    public Conversacion(String nombre) {
        this.nombre = nombre;
        this.mensajes = new ArrayList<>();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public List<Mensaje> getMensajes() { return mensajes; }
    public void setMensajes(List<Mensaje> mensajes) { this.mensajes = mensajes; }
}