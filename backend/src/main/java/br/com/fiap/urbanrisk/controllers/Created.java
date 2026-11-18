package br.com.fiap.urbanrisk.controllers;
import java.util.function.Function;
import org.springframework.http.ResponseEntity;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
/** Resposta 201 com cabeçalho Location apontando para o recurso criado. */
final class Created {
    private Created() {}
    static <T> ResponseEntity<T> of(T body, Function<T, Long> id) {
        var location = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}").buildAndExpand(id.apply(body)).toUri();
        return ResponseEntity.created(location).body(body);
    }
}
