package com.practicas.chat_ia_v2;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface ConversacionRepository extends MongoRepository<Conversacion, String> {
}