package br.com.fiap.spacemission.migration;

import br.com.fiap.spacemission.SpaceMissionApplication;
import com.fasterxml.jackson.databind.*;
import java.nio.file.*;
import java.util.*;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.builder.SpringApplicationBuilder;

/** CLI separado do servidor normal. Simula por padrão; --apply é obrigatório para gravar. */
public final class PresentationCleanupCommand {
    public static void main(String[] args) throws Exception {
        Map<String,String> options=new HashMap<>();
        boolean apply=false;
        for (int i=0; i<args.length; i++) {
            if (args[i].equals("--apply")) { if (apply) throw new IllegalArgumentException("--apply duplicado"); apply=true; }
            else if (Set.of("--database-file", "--manifest", "--report").contains(args[i]) && i+1<args.length) {
                String key=args[i]; if (options.put(key, args[++i]) != null) throw new IllegalArgumentException("Opção duplicada");
            } else throw new IllegalArgumentException("Use --database-file arquivo.mv.db --manifest manifesto.json --report relatorio.json [--apply]");
        }
        if (options.size()!=3) throw new IllegalArgumentException("Informe explicitamente banco, manifesto e relatório");
        Path database=Path.of(options.get("--database-file")).toRealPath();
        Path manifest=Path.of(options.get("--manifest")).toRealPath();
        Path report=Path.of(options.get("--report")).toAbsolutePath().normalize();
        if (!Files.isRegularFile(database) || !database.toString().endsWith(".mv.db")
                || database.toString().contains(";") || report.equals(database) || report.equals(manifest) || Files.exists(report)
                || !Files.isDirectory(report.getParent()) || !Files.isWritable(report.getParent()))
            throw new IllegalArgumentException("Banco deve existir e relatório deve ser um arquivo novo, distinto das entradas");
        String path=database.toString().replace('\\','/');
        String url="jdbc:h2:file:"+path.substring(0,path.length()-".mv.db".length());
        try (var context=new SpringApplicationBuilder(SpaceMissionApplication.class).web(WebApplicationType.NONE).run(
                "--spring.main.web-application-type=none", "--spring.datasource.url="+url,
                "--spring.jpa.hibernate.ddl-auto=validate", "--app.seed-enabled=false",
                "--app.presentation-cleanup.enabled=true", "--spring.main.banner-mode=off")) {
            ObjectMapper json=context.getBean(ObjectMapper.class);
            var result=context.getBean(PresentationCleanupService.class).execute(json.readTree(manifest.toFile()),apply);
            Files.writeString(report,json.writerWithDefaultPrettyPrinter().writeValueAsString(result),StandardOpenOption.CREATE_NEW);
            System.out.printf("PRESENTATION_CLEANUP dryRun=%s alreadyApplied=%s changedRecords=%d preservedRecords=%d%n",
                result.dryRun(),result.alreadyApplied(),result.changedRecords(),result.preservedRecords());
        }
    }
}
