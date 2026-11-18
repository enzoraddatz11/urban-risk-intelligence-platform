package br.com.fiap.urbanrisk.config;
import java.time.Clock;
import org.springframework.context.annotation.*;
/** Relógio injetável: permite testar a priorização com horários fixos. */
@Configuration
public class ClockConfig {
    @Bean Clock clock() { return Clock.systemUTC(); }
}
