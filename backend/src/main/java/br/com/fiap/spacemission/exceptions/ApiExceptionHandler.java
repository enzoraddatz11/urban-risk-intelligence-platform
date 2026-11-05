package br.com.fiap.spacemission.exceptions;
import java.time.Instant;
import java.util.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.*;
import org.springframework.web.bind.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.dao.DataIntegrityViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
@RestControllerAdvice
public class ApiExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);
    public record ApiError(Instant timestamp, int status, String message, String path, Map<String,String> errors) {}
    private ResponseEntity<ApiError> error(HttpStatus status, String message, HttpServletRequest request, Map<String,String> errors) {
        return ResponseEntity.status(status).body(new ApiError(Instant.now(), status.value(), message, request.getRequestURI(), errors));
    }
    @ExceptionHandler(ResourceNotFoundException.class)
    ResponseEntity<ApiError> missing(ResourceNotFoundException e, HttpServletRequest r) {
        return error(HttpStatus.NOT_FOUND, e.getMessage(), r, Map.of());
    }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiError> invalid(MethodArgumentNotValidException e, HttpServletRequest r) {
        Map<String,String> fields = new TreeMap<>();
        e.getBindingResult().getFieldErrors().forEach(f -> fields.put(f.getField(), f.getDefaultMessage()));
        return error(HttpStatus.BAD_REQUEST, "Dados inválidos", r, fields);
    }
    @ExceptionHandler({ConstraintViolationException.class, HandlerMethodValidationException.class,
        MethodArgumentTypeMismatchException.class, HttpMessageNotReadableException.class, MissingServletRequestParameterException.class})
    ResponseEntity<ApiError> malformed(Exception e, HttpServletRequest r) {
        return error(HttpStatus.BAD_REQUEST, "Verifique o JSON, os tipos, os valores enum e os parâmetros enviados", r, Map.of());
    }
    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<ApiError> conflict(DataIntegrityViolationException e, HttpServletRequest r) {
        return error(HttpStatus.CONFLICT, "Os dados violam uma restrição de integridade", r, Map.of());
    }
    @ExceptionHandler(org.springframework.web.HttpRequestMethodNotSupportedException.class)
    ResponseEntity<ApiError> method(Exception e, HttpServletRequest r) {
        return error(HttpStatus.METHOD_NOT_ALLOWED, "Método HTTP não permitido", r, Map.of());
    }
    @ExceptionHandler(org.springframework.web.servlet.resource.NoResourceFoundException.class)
    ResponseEntity<ApiError> route(Exception e, HttpServletRequest r) {
        return error(HttpStatus.NOT_FOUND, "Endpoint não encontrado", r, Map.of());
    }
    @ExceptionHandler(org.springframework.web.HttpMediaTypeNotSupportedException.class)
    ResponseEntity<ApiError> media(Exception e, HttpServletRequest r) {
        return error(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Utilize Content-Type: application/json", r, Map.of());
    }
    @ExceptionHandler(Exception.class)
    ResponseEntity<ApiError> unexpected(Exception e, HttpServletRequest r) {
        log.error("Erro inesperado em {}", r.getRequestURI(), e);
        return error(HttpStatus.INTERNAL_SERVER_ERROR, "Erro interno ao processar a requisição", r, Map.of());
    }
}
