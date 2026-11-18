package br.com.fiap.urbanrisk.privacy;
import jakarta.validation.*;
import java.lang.annotation.*;
/** Rejeita textos com e-mail, CPF, telefone ou nome declarado. */
@Documented
@Constraint(validatedBy = NoPersonalData.Validator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT})
@Retention(RetentionPolicy.RUNTIME)
public @interface NoPersonalData {
    String message() default "Remova dados pessoais do relato (e-mail, CPF, telefone ou nome). Descreva apenas a situação observada.";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
    class Validator implements ConstraintValidator<NoPersonalData, String> {
        @Override public boolean isValid(String value, ConstraintValidatorContext context) {
            return PersonalDataGuard.findPersonalData(value).isEmpty();
        }
    }
}
