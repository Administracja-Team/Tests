import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import ProjectInfo from '@/views/ProjectInfo.vue';

describe('ProjectInfo.vue', () => {
    let wrapper;

    beforeEach(() => {
        // Монтируем компонент перед каждым тестом
        wrapper = mount(ProjectInfo, {
            props: {
                show: true,
            },
            global: {
                stubs: ['Dialog', 'Card', 'Button'],
            }
        });
    });

    it('renders Dialog when show is true', () => {
        const dialog = wrapper.findComponent({ name: 'Dialog' });
        expect(dialog.exists()).toBe(true);
    });

    it('emits update:show when Close button is clicked', async () => {
        const closeButton = wrapper.find('button');
        await closeButton.trigger('click');
        expect(wrapper.emitted('update:show')).toBeTruthy();
        expect(wrapper.emitted('update:show')[0]).toEqual([false]);
    });

    it('renders video with correct attributes', () => {
        const video = wrapper.find('video');
        expect(video.exists()).toBe(true);
        expect(video.attributes('autoplay')).toBeDefined();
        expect(video.attributes('loop')).toBeDefined();
        expect(video.attributes('controls')).toBeDefined();
        expect(video.attributes('src')).toContain('promo.mp4');
    });

    it('calls enterFullscreen on show=true', () => {
        const spy = vi.spyOn(document, 'querySelector').mockReturnValue({
            requestFullscreen: vi.fn(),
        });

        mount(ProjectInfo, {
            props: {
                show: true,
            },
            global: {
                stubs: ['Dialog', 'Card', 'Button'],
            }
        });

        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });
});
