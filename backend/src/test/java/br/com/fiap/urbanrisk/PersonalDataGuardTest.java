package br.com.fiap.urbanrisk;
import br.com.fiap.urbanrisk.privacy.PersonalDataGuard;
import java.util.List;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class PersonalDataGuardTest {
    @ParameterizedTest
    @ValueSource(strings = {
        "Falar comigo em morador.rua7@email.com.br",
        "Meu CPF é 123.456.789-09",
        "cpf 12345678909 para contato",
        "Liguem (11) 98765-4321",
        "whats 11987654321",
        "+55 11 3456-7890 da associação",
        "Meu nome é Maria e a rua alagou",
        "me chamo joão, a luz caiu",
    })
    void recusaTextosComDadosPessoais(String text) {
        assertFalse(PersonalDataGuard.findPersonalData(text).isEmpty(), text);
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "Água subiu 30 cm às 14h na rua 25 de Março.",
        "Chuva de 61 mm/h desde 2026, perto do número 1500.",
        "Falta de luz no quarteirão; semáforos apagados há 2 horas.",
        "CEP da região 01234-567, bueiro entupido.",
        "Sou morador há 10 anos e nunca vi tanto calor.",
    })
    void aceitaRelatosAnonimos(String text) {
        assertEquals(List.of(), PersonalDataGuard.findPersonalData(text), text);
    }

    @Test void identificaOTipoDeDado() {
        assertEquals(List.of("e-mail", "telefone"), PersonalDataGuard.findPersonalData("a@b.com ou (21) 2345-6789"));
        assertEquals(List.of(), PersonalDataGuard.findPersonalData(null));
    }
}
