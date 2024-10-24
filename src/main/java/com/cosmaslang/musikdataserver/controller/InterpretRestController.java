package com.cosmaslang.musikdataserver.controller;

import com.cosmaslang.musikdataserver.db.entities.Interpret;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/musik/interpret")
public class InterpretRestController extends AbstractMusikRestController<Interpret> {
    @Override
    public Interpret findById(@PathVariable Long id) {
        return getEntityIfExists(id, interpretRepository);
    }

    @Override
    protected String remove(Long id) {
        return null;
    }

    @Override
    protected List<Interpret> get(String track, String album, String komponist, String werk, String genre, String interpret, Long id) {
        if (interpret != null) {
            return interpretRepository.findByNameContainingIgnoreCase(interpret).stream().sorted().toList();
        }
        return get(id, interpretRepository);
    }
}
