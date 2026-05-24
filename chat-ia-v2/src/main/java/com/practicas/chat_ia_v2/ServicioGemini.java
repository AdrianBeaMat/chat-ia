package com.practicas.chat_ia_v2;

import com.google.genai.Client;
import com.google.genai.types.Content;
import com.google.genai.types.GenerateContentResponse;
import com.google.genai.types.Part;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class ServicioGemini {

    private final Client cliente;
    private final ConversacionRepository repositorio;

    public ServicioGemini(ConversacionRepository repositorio) {
        this.cliente = new Client();
        this.repositorio = repositorio;
    }

    public Conversacion enviarMensaje(String idConversacion, String mensajeUsuario) {
        // 1. Buscamos la conversación por su id. Si no existe, lanzamos un error.
        Conversacion conversacion = repositorio.findById(idConversacion)
                .orElseThrow(() -> new RuntimeException("Conversación no encontrada: " + idConversacion));

        // 2. Añadimos el mensaje del usuario al historial.
        conversacion.getMensajes().add(new Mensaje("user", mensajeUsuario));

        // 3. Construimos el historial para Gemini.
        List<Content> historial = new ArrayList<>();
        for (Mensaje m : conversacion.getMensajes()) {
            historial.add(
                    Content.builder()
                            .role(m.getRol())
                            .parts(List.of(Part.fromText(m.getTexto())))
                            .build()
            );
        }

        // 4. Llamamos a Gemini.
        GenerateContentResponse respuesta = cliente.models.generateContent(
                "gemini-2.5-flash",
                historial,
                null
        );
        String textoRespuesta = respuesta.text();

        // 5. Guardamos la respuesta del modelo.
        conversacion.getMensajes().add(new Mensaje("model", textoRespuesta));

        // 6. Persistimos y devolvemos la conversación entera actualizada.
        return repositorio.save(conversacion);
    }
}