package com.cutie_cuts_app.example.cutie_cuts_app.service;

import com.cutie_cuts_app.example.cutie_cuts_app.dto.payment.VietQRRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.dto.payment.VietQRResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class VietQRService {

    private static final Logger logger = LoggerFactory.getLogger(VietQRService.class);

    @Value("${vietqr.api.url:https://api.vietqr.io/v2}")
    private String vietqrApiUrl;

    @Value("${vietqr.bank.id:970422}")
    private String bankId;

    @Value("${vietqr.account.no:100845448666}")
    private String accountNo;

    @Value("${vietqr.account.name:CUTIE CUTS SALON}")
    private String accountName;

    @Value("${vietqr.template:compact2}")
    private String template;

    private final RestTemplate restTemplate;

    public VietQRService() {
        this.restTemplate = new RestTemplate();
    }

    public VietQRResponse generateQRCode(String paymentCode, Double amount) {
        try {
            VietQRRequest request = new VietQRRequest();
            request.setAccountNo(accountNo);
            request.setAccountName(accountName);
            request.setAcqId(bankId);
            request.setAmount(amount);
            request.setAddInfo(paymentCode);
            request.setFormat("text");
            request.setTemplate(template);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<VietQRRequest> entity = new HttpEntity<>(request, headers);

            String url = vietqrApiUrl + "/generate";
            logger.info("Calling VietQR API: {} with payment code: {}, amount: {}", url, paymentCode, amount);
            logger.info("Request body: accountNo={}, bankId={}, accountName={}", accountNo, bankId, accountName);

            ResponseEntity<VietQRResponse> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    VietQRResponse.class);

            logger.info("VietQR API response status: {}", response.getStatusCode());

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                VietQRResponse body = response.getBody();
                logger.info("VietQR API response code: {}, desc: {}", body.getCode(), body.getDesc());

                if (body.getData() != null) {
                    logger.info("QR Code generated successfully. QR URL length: {}",
                            body.getData().getQrDataURL() != null ? body.getData().getQrDataURL().length() : 0);
                } else {
                    logger.warn("VietQR response data is null");
                }

                return body;
            } else {
                logger.error("VietQR API returned non-OK status: {}", response.getStatusCode());
                throw new RuntimeException("Failed to generate QR code");
            }

        } catch (Exception e) {
            logger.error("Error calling VietQR API: {}", e.getMessage(), e);
            // Return null instead of throwing exception to allow payment creation to
            // continue
            logger.warn("Continuing payment creation without QR code");
            return null;
        }
    }
}
