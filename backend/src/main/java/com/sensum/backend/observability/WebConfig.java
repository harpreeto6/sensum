package com.sensum.backend.observability;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Spring MVC configuration that registers application-wide interceptors.
 *
 * <p>This class plugs the {@link RequestLoggingInterceptor} into the Spring MVC request lifecycle. Once
 * registered, Spring will invoke the interceptor for every matching request path.</p>
 *
 * <p>We intentionally exclude {@code /metrics/**} to avoid self-observing the metrics endpoint, which would
 * inflate request counts and create noisy logs.</p>
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final RequestLoggingInterceptor requestLoggingInterceptor;

    public WebConfig(RequestLoggingInterceptor requestLoggingInterceptor) {
        this.requestLoggingInterceptor = requestLoggingInterceptor;
    }

    /**
     * Registers interceptors.
     *
     * @param registry interceptor registry used by Spring MVC
     */
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // Register our logging interceptor on all paths.
        registry.addInterceptor(requestLoggingInterceptor)
                .addPathPatterns("/**")
                .excludePathPatterns("/metrics", "/metrics/**");
    }
}
