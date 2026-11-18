package br.com.fiap.urbanrisk.privacy;
import java.util.*;
import java.util.regex.Pattern;

/**
 * Detecta dados pessoais identificáveis em textos livres de relatos comunitários:
 * e-mail, CPF, telefone brasileiro (fixo ou celular) e apresentações explícitas de nome.
 */
public final class PersonalDataGuard {
    private PersonalDataGuard() {}
    private static final Map<String, Pattern> PATTERNS = new LinkedHashMap<>();
    static {
        PATTERNS.put("e-mail", Pattern.compile("[\\w.+-]+@[\\w-]+(\\.[\\w-]+)+"));
        PATTERNS.put("CPF", Pattern.compile("(?<!\\d)\\d{3}\\.?\\d{3}\\.?\\d{3}-?\\d{2}(?!\\d)"));
        PATTERNS.put("telefone", Pattern.compile("(?<!\\d)(\\+?55\\s?)?\\(?\\d{2}\\)?[\\s-]?9?\\d{4}[\\s-]?\\d{4}(?!\\d)"));
        PATTERNS.put("nome", Pattern.compile("(?iu)\\b(meu nome é|me chamo)\\s+\\p{L}"));
    }
    /** Tipos de dado pessoal encontrados, na ordem de verificação; vazio quando o texto é anônimo. */
    public static List<String> findPersonalData(String text) {
        if (text == null || text.isBlank()) return List.of();
        List<String> found = new ArrayList<>();
        PATTERNS.forEach((label, pattern) -> { if (pattern.matcher(text).find()) found.add(label); });
        return found;
    }
}
