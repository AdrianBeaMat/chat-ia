package com.practicas.chat_ia_v2;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/conversaciones")
public class ConversacionController {

    private final ConversacionRepository repositorio;
    private final ServicioGemini servicioGemini;

    public ConversacionController(ConversacionRepository repositorio, ServicioGemini servicioGemini) {
        this.repositorio = repositorio;
        this.servicioGemini = servicioGemini;
    }

    // 1. Listar todas las conversaciones
    @GetMapping
    public List<Conversacion> listar() {
        return repositorio.findAll();
    }

    // 2. Crear una nueva conversación
    @PostMapping
    public Conversacion crear(@RequestBody CrearConversacionRequest peticion) {
        Conversacion conversacion = new Conversacion(peticion.getNombre());
        return repositorio.save(conversacion);
    }

    // 3. Obtener una conversación concreta
    @GetMapping("/{id}")
    public Conversacion obtener(@PathVariable String id) {
        return repositorio.findById(id)
                .orElseThrow(() -> new RuntimeException("Conversación no encontrada: " + id));
    }

    // 4. Renombrar una conversación
    @PutMapping("/{id}")
    public Conversacion renombrar(@PathVariable String id, @RequestBody CrearConversacionRequest peticion) {
        Conversacion conversacion = repositorio.findById(id)
                .orElseThrow(() -> new RuntimeException("Conversación no encontrada: " + id));
        conversacion.setNombre(peticion.getNombre());
        return repositorio.save(conversacion);
    }

    // 5. Borrar una conversación
    @DeleteMapping("/{id}")
    public void borrar(@PathVariable String id) {
        repositorio.deleteById(id);
    }

    // 6. Mandar un mensaje a una conversación concreta
    @PostMapping("/{id}/mensajes")
    public Conversacion mandarMensaje(@PathVariable String id, @RequestBody MensajeEntrada mensaje) {
        return servicioGemini.enviarMensaje(id, mensaje.getTexto());
    }
}