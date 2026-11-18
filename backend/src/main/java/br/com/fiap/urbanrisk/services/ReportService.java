package br.com.fiap.urbanrisk.services;
import br.com.fiap.urbanrisk.dto.PageResponse;
import br.com.fiap.urbanrisk.dto.ReportDtos.*;
import br.com.fiap.urbanrisk.entities.*;
import br.com.fiap.urbanrisk.exceptions.ResourceNotFoundException;
import br.com.fiap.urbanrisk.repositories.*;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@Service
@Transactional(readOnly=true)
public class ReportService {
    /** Relato isolado de morador: confiança média-baixa até ser corroborado por outros relatos ou sensores. */
    public static final int COMMUNITY_CONFIDENCE = 40;
    private final CommunityReportRepository repository;
    private final RegionRepository regions;
    public ReportService(CommunityReportRepository repository, RegionRepository regions) { this.repository = repository; this.regions = regions; }
    public PageResponse<Response> list(int page, int size, Long regionId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("occurredAt").descending().and(Sort.by("id").descending()));
        if (regionId != null && !regions.existsById(regionId)) throw new ResourceNotFoundException("Região", regionId);
        return PageResponse.from(regionId == null ? repository.findAll(pageable) : repository.findByRegionId(regionId, pageable), Response::from);
    }
    public Response get(Long id) { return Response.from(repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Relato", id))); }
    @Transactional
    public Response create(Request request) {
        CommunityReport entity = new CommunityReport();
        entity.riskType = request.riskType();
        entity.description = request.description().trim();
        entity.occurredAt = request.occurredAt();
        entity.source = DataSource.COMUNITARIO;
        entity.confidence = COMMUNITY_CONFIDENCE;
        entity.region = regions.findById(request.regionId()).orElseThrow(() -> new ResourceNotFoundException("Região", request.regionId()));
        return Response.from(repository.save(entity));
    }
}
